from datetime import datetime, date, timedelta
from calendar import monthrange

def days_in_month(year: int, month: int) -> int:
    return monthrange(year, month)[1]

def days_until_due(due_day: int) -> int:
    today = date.today()
    due_date = date(today.year, today.month, min(due_day, days_in_month(today.year, today.month)))
    if due_date < today:
        next_month = today.month + 1 if today.month < 12 else 1
        next_year = today.year + 1 if next_month == 1 else today.year
        due_date = date(next_year, next_month, min(due_day, days_in_month(next_year, next_month)))
    return (due_date - today).days

def rent_status(due_day: int) -> dict:
    d = days_until_due(due_day)
    if d < 0:
        return {"status": "overdue", "days": abs(d), "label": f"{abs(d)} day(s) overdue"}
    elif d == 0:
        return {"status": "due_today", "days": 0, "label": "Due today"}
    elif d <= 3:
        return {"status": "due_soon", "days": d, "label": f"Due in {d} day(s)"}
    else:
        return {"status": "on_track", "days": d, "label": f"{d} day(s) remaining"}

def calculate_penalty(monthly_rent: float, overdue_days: int, penalty_rate: float = 0.02) -> float:
    if overdue_days <= 0:
        return 0.0
    return round(monthly_rent * penalty_rate * min(overdue_days, 30) / 30, 2)

def prorate_rent(monthly_rent: float, move_in_day: int, year: int, month: int) -> float:
    total_days = days_in_month(year, month)
    remaining_days = total_days - move_in_day + 1
    return round(monthly_rent * remaining_days / total_days, 2)

def months_between(start_date: date, end_date: date) -> int:
    return (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)

def total_due_for_period(monthly_rent: float, months: int, paid_months: int) -> dict:
    total = monthly_rent * months
    paid = monthly_rent * paid_months
    pending = total - paid
    return {
        "total_due": round(total, 2),
        "total_paid": round(paid, 2),
        "pending": round(pending, 2),
        "months_total": months,
        "months_paid": paid_months,
        "months_pending": months - paid_months,
    }

def lease_time_remaining(lease_end: date) -> dict:
    today = date.today()
    if today > lease_end:
        return {
            "expired": True,
            "days_over": (today - lease_end).days,
            "message": f"Lease ended {(today - lease_end).days} day(s) ago. Please renew."
        }
    remaining = (lease_end - today).days
    return {
        "expired": False,
        "days_remaining": remaining,
        "message": f"{remaining} day(s) remaining in lease."
    }

def generate_due_months(start_year: int, start_month: int, total_months: int) -> list:
    months = []
    for i in range(total_months):
        y = start_year + (start_month + i - 1) // 12
        m = (start_month + i - 1) % 12 + 1
        months.append({"year": y, "month": m})
    return months
