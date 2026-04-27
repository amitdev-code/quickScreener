resource "aws_secretsmanager_secret" "jwt_keys" {
  name        = "aiscreener/jwt-keys"
  description = "RS256 private and public keys for platform JWT signing"
}

resource "aws_secretsmanager_secret" "mfa_encryption_key" {
  name        = "aiscreener/mfa-encryption-key"
  description = "AES-256-GCM key for encrypting TOTP secrets at rest"
}

resource "aws_secretsmanager_secret" "smtp_credentials" {
  name        = "aiscreener/smtp-credentials"
  description = "SMTP credentials for transactional email (password reset, MFA backup codes)"
}
