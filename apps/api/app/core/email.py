import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings


def _otp_html(otp: str, name: str) -> str:
    return f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
      <h2 style="color:#111">Verify your email</h2>
      <p style="color:#555">Hi {name}, use the code below to complete your registration.</p>
      <div style="font-size:2.2rem;font-weight:800;letter-spacing:8px;
                  background:#f3f3f3;border-radius:12px;padding:20px;
                  text-align:center;color:#1a1a1a;margin:24px 0">
        {otp}
      </div>
      <p style="color:#999;font-size:0.85rem">
        This code expires in 10 minutes. If you didn't register, ignore this email.
      </p>
    </div>
    """


async def send_otp_email(to_email: str, full_name: str, otp: str) -> None:
    # Always print to console — useful in development and as a fallback
    print(f"\n{'='*48}\n  OTP for {to_email}: {otp}\n{'='*48}\n", flush=True)

    if not settings.SMTP_HOST:
        return  # no SMTP configured — console output is enough in dev

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{otp} is your AIScreener verification code"
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(_otp_html(otp, full_name), "html"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls(context=context)
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
    except Exception as exc:
        # Don't crash the request if email fails — OTP is already in Redis
        print(f"[email] Failed to send to {to_email}: {exc}", flush=True)
