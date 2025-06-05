# Set Terraform Token

Securely configure Terraform CLI authentication using a Terraform Cloud token and organization name.

This GitHub Action creates either a `.terraformrc` or `credentials.tfrc.json` file with the provided API token and validates the token against the organization using the Terraform Cloud API.

## 🔐 Features

- Masked Terraform Cloud token handling
- Organization-level token validation
- Cross-platform support (Linux, macOS, Windows)
- Supports HCL and JSON-based Terraform CLI config
- Backup of existing credentials
- Configurable log level and append behavior

---

## 📥 Inputs

| Name               | Description                                       | Required | Default |
|--------------------|---------------------------------------------------|----------|---------|
| `tfe_token`        | Terraform Cloud API token                         | ✅       | —       |
| `tfe_organization` | Terraform Cloud organization name                 | ✅       | —       |
| `use_json`         | Use `credentials.tfrc.json` instead of `.terraformrc` | ❌       | `true`  |
| `append`           | Append to existing file instead of overwriting   | ❌       | `false` |
| `log_level`        | Logging level: `debug`, `info`, or `warn`        | ❌       | `info`  |

---

## 🚀 Usage

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set Terraform Token
        uses: ukhan262/set-terraform-token@v1
        with:
          tfe_token: ${{ secrets.TFE_TOKEN }}
          tfe_organization: your-org-name
          use_json: true
          append: false
          log_level: debug
