import csv
import json
import os
import re

def clean_str(val):
    if val is None:
        return ""
    v = str(val).strip()
    return "" if v.lower() in ["nan", "null", "none", "#n/a", "n/a", ""] else v

def parse_num(val):
    if val is None:
        return 0.0
    v = str(val).strip().replace(",", "").replace("$", "").replace("₹", "")
    if v.lower() in ["nan", "null", "none", "", "-", "#n/a", "n/a"]:
        return 0.0
    try:
        return float(v)
    except:
        return 0.0

def parse_deals_csv(file_path):
    deals = []
    with open(file_path, mode='r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        header = None
        for i, row in enumerate(reader):
            if not row or not any(row):
                continue
            # Header detection
            if header is None:
                if "Deal Name" in row:
                    header = [c.strip() for c in row]
                continue
            
            # Skip repeating headers inside the file
            if "Deal Name" in row and "Owner code" in row:
                continue
            
            # Map row
            item = {}
            for col_idx, col_name in enumerate(header):
                if col_idx < len(row):
                    item[col_name] = row[col_idx].strip()
                else:
                    item[col_name] = ""
            
            # Deal values
            deal_name = clean_str(item.get("Deal Name", ""))
            owner_code = clean_str(item.get("Owner code", ""))
            client_code = clean_str(item.get("Client Code", ""))
            deal_status = clean_str(item.get("Deal Status", "Open"))
            close_date = clean_str(item.get("Close Date (A)", ""))
            closure_prob = clean_str(item.get("Closure Probability", ""))
            deal_value = parse_num(item.get("Masked Deal value", 0))
            tentative_close = clean_str(item.get("Tentative Close Date", ""))
            deal_stage = clean_str(item.get("Deal Stage", "A. Lead Generated"))
            product_deal = clean_str(item.get("Product deal", ""))
            sector = clean_str(item.get("Sector/service", "Others"))
            created_date = clean_str(item.get("Created Date", ""))

            # Filter out empty noise rows
            if not deal_name and not client_code and deal_value == 0:
                continue

            # Probability normalization
            prob_percent = 0.5 # default medium
            prob_lower = closure_prob.lower()
            if "high" in prob_lower or "8" in prob_lower or "9" in prob_lower:
                prob_percent = 0.85
                prob_label = "High"
            elif "medium" in prob_lower or "med" in prob_lower or "5" in prob_lower:
                prob_percent = 0.50
                prob_label = "Medium"
            elif "low" in prob_lower or "2" in prob_lower or "3" in prob_lower:
                prob_percent = 0.25
                prob_label = "Low"
            else:
                # Stage-based probability heuristic if probability is missing
                if "won" in deal_stage.lower() or deal_status.lower() == "won":
                    prob_percent = 1.0
                    prob_label = "Won"
                elif "lost" in deal_stage.lower() or deal_status.lower() == "dead":
                    prob_percent = 0.0
                    prob_label = "Lost"
                elif "negotiat" in deal_stage.lower() or "work order" in deal_stage.lower():
                    prob_percent = 0.85
                    prob_label = "High"
                elif "proposal" in deal_stage.lower() or "commercial" in deal_stage.lower():
                    prob_percent = 0.50
                    prob_label = "Medium"
                elif "demo" in deal_stage.lower() or "feasibility" in deal_stage.lower():
                    prob_percent = 0.35
                    prob_label = "Medium-Low"
                else:
                    prob_percent = 0.20
                    prob_label = "Low"

            # Normalized status
            status_norm = deal_status
            if not status_norm:
                if "won" in deal_stage.lower():
                    status_norm = "Won"
                elif "lost" in deal_stage.lower():
                    status_norm = "Dead"
                elif "hold" in deal_stage.lower():
                    status_norm = "On Hold"
                else:
                    status_norm = "Open"

            # Sector normalization
            sector_norm = sector
            if not sector_norm or sector_norm.lower() in ["nan", "sector/service", "none"]:
                sector_norm = "Others"
            elif "renew" in sector_norm.lower() or "solar" in sector_norm.lower() or "wind" in sector_norm.lower():
                sector_norm = "Renewables"
            elif "power" in sector_norm.lower() or "transm" in sector_norm.lower():
                sector_norm = "Powerline"
            elif "rail" in sector_norm.lower():
                sector_norm = "Railways"
            elif "mine" in sector_norm.lower() or "mining" in sector_norm.lower():
                sector_norm = "Mining"
            elif "dsp" in sector_norm.lower():
                sector_norm = "DSP"
            elif "tender" in sector_norm.lower():
                sector_norm = "Tender"
            elif "surveil" in sector_norm.lower() or "security" in sector_norm.lower():
                sector_norm = "Security & Surveillance"
            elif "construct" in sector_norm.lower() or "infra" in sector_norm.lower():
                sector_norm = "Construction"

            # Anomaly checks
            anomalies = []
            if not close_date and not tentative_close and status_norm == "Open":
                anomalies.append("Missing Close & Tentative Date")
            if deal_value <= 0:
                anomalies.append("Zero or Missing Deal Value")
            if not owner_code:
                anomalies.append("Unassigned Owner")
            if not client_code:
                anomalies.append("Missing Client Code")

            deals.append({
                "id": f"DEAL_{i+1:04d}",
                "dealName": deal_name or "Unnamed Deal",
                "ownerCode": owner_code or "UNASSIGNED",
                "clientCode": client_code or "UNKNOWN_CLIENT",
                "dealStatus": status_norm,
                "dealStage": deal_stage,
                "closureProbabilityLabel": prob_label,
                "closureProbabilityPercent": prob_percent,
                "dealValue": deal_value,
                "weightedValue": round(deal_value * prob_percent, 2),
                "closeDate": close_date,
                "tentativeCloseDate": tentative_close,
                "createdDate": created_date,
                "productDeal": product_deal or "General Services",
                "sector": sector_norm,
                "anomalies": anomalies,
                "rawData": item
            })
    return deals

def parse_wo_csv(file_path):
    wos = []
    with open(file_path, mode='r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        header = None
        for i, row in enumerate(reader):
            if not row or not any(row):
                continue
            # Look for header row (contains "Deal name masked" or "Customer Name Code")
            if header is None:
                if "Deal name masked" in row or "Customer Name Code" in row:
                    header = [c.strip() for c in row]
                continue
            
            # Skip repeating headers
            if "Deal name masked" in row and "Customer Name Code" in row:
                continue

            item = {}
            for col_idx, col_name in enumerate(header):
                if col_idx < len(row):
                    item[col_name] = row[col_idx].strip()
                else:
                    item[col_name] = ""

            deal_name = clean_str(item.get("Deal name masked", ""))
            client_code = clean_str(item.get("Customer Name Code", ""))
            serial_no = clean_str(item.get("Serial #", f"WO_{i+1:03d}"))
            nature_of_work = clean_str(item.get("Nature of Work", ""))
            exec_status = clean_str(item.get("Execution Status", "Ongoing"))
            delivery_date = clean_str(item.get("Data Delivery Date", ""))
            po_date = clean_str(item.get("Date of PO/LOI", ""))
            doc_type = clean_str(item.get("Document Type", "Purchase Order"))
            prob_start = clean_str(item.get("Probable Start Date", ""))
            prob_end = clean_str(item.get("Probable End Date", ""))
            owner_code = clean_str(item.get("BD/KAM Personnel code", ""))
            sector = clean_str(item.get("Sector", "Others"))
            type_of_work = clean_str(item.get("Type of Work", ""))
            skylark_sw = clean_str(item.get("Is any Skylark software platform part of the client deliverables in this deal?", "NONE"))
            last_invoice_date = clean_str(item.get("Last invoice date", ""))
            invoice_no = clean_str(item.get("latest invoice no.", ""))
            
            amount_excl_gst = parse_num(item.get("Amount in Rupees (Excl of GST) (Masked)", 0))
            amount_incl_gst = parse_num(item.get("Amount in Rupees (Incl of GST) (Masked)", 0))
            billed_excl_gst = parse_num(item.get("Billed Value in Rupees (Excl of GST.) (Masked)", 0))
            billed_incl_gst = parse_num(item.get("Billed Value in Rupees (Incl of GST.) (Masked)", 0))
            collected_incl_gst = parse_num(item.get("Collected Amount in Rupees (Incl of GST.) (Masked)", 0))
            to_be_billed_excl = parse_num(item.get("Amount to be billed in Rs. (Exl. of GST) (Masked)", 0))
            to_be_billed_incl = parse_num(item.get("Amount to be billed in Rs. (Incl. of GST) (Masked)", 0))
            ar_receivable = parse_num(item.get("Amount Receivable (Masked)", 0))
            ar_priority = clean_str(item.get("AR Priority account", ""))
            
            qty_ops = parse_num(item.get("Quantity by Ops", 0))
            qty_po = parse_num(item.get("Quantities as per PO", 0))
            qty_billed = parse_num(item.get("Quantity billed (till date)", 0))
            balance_qty = parse_num(item.get("Balance in quantity", 0))
            
            invoice_status = clean_str(item.get("Invoice Status", ""))
            wo_status = clean_str(item.get("WO Status (billed)", ""))
            billing_status = clean_str(item.get("Billing Status", ""))
            
            if not deal_name and not client_code and amount_excl_gst == 0:
                continue

            # Normalized execution status
            norm_exec = exec_status
            if not norm_exec:
                norm_exec = "Ongoing"
            elif "executed until" in norm_exec.lower():
                norm_exec = "In Progress (Monthly)"
            elif "pause" in norm_exec.lower() or "struck" in norm_exec.lower() or "stuck" in norm_exec.lower():
                norm_exec = "Blocked / On Hold"
            elif "partial" in norm_exec.lower():
                norm_exec = "Partially Completed"
            elif "pending" in norm_exec.lower():
                norm_exec = "Client Dependency Pending"

            # Sector normalization
            norm_sector = sector
            if not norm_sector or norm_sector.lower() in ["nan", "none"]:
                norm_sector = "Others"
            elif "renew" in norm_sector.lower():
                norm_sector = "Renewables"
            elif "power" in norm_sector.lower():
                norm_sector = "Powerline"
            elif "rail" in norm_sector.lower():
                norm_sector = "Railways"
            elif "mine" in norm_sector.lower() or "mining" in norm_sector.lower():
                norm_sector = "Mining"
            elif "dsp" in norm_sector.lower():
                norm_sector = "DSP"
            elif "construct" in norm_sector.lower():
                norm_sector = "Construction"

            # Normalized billing status
            norm_billing = billing_status
            if not norm_billing:
                if invoice_status:
                    norm_billing = invoice_status
                elif billed_incl_gst >= amount_incl_gst and amount_incl_gst > 0:
                    norm_billing = "Fully Billed"
                elif billed_incl_gst > 0:
                    norm_billing = "Partially Billed"
                else:
                    norm_billing = "Unbilled"

            # Anomaly detection
            anomalies = []
            if ar_receivable < 0:
                anomalies.append(f"Negative AR balance ({ar_receivable:,.2f})")
            if not po_date:
                anomalies.append("Missing PO/LOI Date")
            if norm_exec == "Completed" and not delivery_date:
                anomalies.append("Completed without Delivery Date recorded")
            if ar_priority.lower() == "priority" and ar_receivable > 0:
                anomalies.append("High-Priority AR Collection Risk")
            if qty_po > 0 and qty_ops > (qty_po * 1.25):
                anomalies.append(f"Ops Quantity ({qty_ops}) exceeds PO ({qty_po}) by >25%")

            wos.append({
                "id": serial_no or f"WO_{i+1:04d}",
                "serialNo": serial_no,
                "dealName": deal_name or "Unnamed Project",
                "clientCode": client_code or "UNKNOWN_CLIENT",
                "natureOfWork": nature_of_work or "General Project",
                "executionStatus": norm_exec,
                "dataDeliveryDate": delivery_date,
                "poDate": po_date,
                "documentType": doc_type,
                "probableStartDate": prob_start,
                "probableEndDate": prob_end,
                "ownerCode": owner_code or "UNASSIGNED",
                "sector": norm_sector,
                "typeOfWork": type_of_work or "Standard Survey",
                "hasSkylarkSoftware": "YES" if ("spectra" in skylark_sw.lower() or "yes" in skylark_sw.lower()) else ("NONE" if skylark_sw else "NONE"),
                "softwarePlatform": skylark_sw,
                "lastInvoiceDate": last_invoice_date,
                "latestInvoiceNo": invoice_no,
                "amountExclGst": amount_excl_gst,
                "amountInclGst": amount_incl_gst,
                "billedExclGst": billed_excl_gst,
                "billedInclGst": billed_incl_gst,
                "collectedInclGst": collected_incl_gst,
                "toBeBilledExcl": to_be_billed_excl,
                "toBeBilledIncl": to_be_billed_incl,
                "arReceivable": ar_receivable,
                "isPriorityAR": ar_priority.lower() == "priority" or "priority" in ar_priority.lower(),
                "quantityOps": qty_ops,
                "quantityPO": qty_po,
                "quantityBilled": qty_billed,
                "balanceQuantity": balance_qty,
                "invoiceStatus": invoice_status,
                "billingStatus": norm_billing,
                "woStatus": wo_status,
                "anomalies": anomalies,
                "rawData": item
            })
    return wos

if __name__ == "__main__":
    os.makedirs("src/data", exist_ok=True)
    deals = parse_deals_csv("Deal funnel Data.xlsx - Deal tracker.csv")
    wos = parse_wo_csv("Work_Order_Tracker Data.xlsx - work order tracker.csv")
    
    with open("src/data/rawDeals.json", "w", encoding="utf-8") as f:
        json.dump(deals, f, indent=2)
    with open("src/data/rawWorkOrders.json", "w", encoding="utf-8") as f:
        json.dump(wos, f, indent=2)

    print(f"Successfully processed {len(deals)} deals and {len(wos)} work orders into src/data/")
