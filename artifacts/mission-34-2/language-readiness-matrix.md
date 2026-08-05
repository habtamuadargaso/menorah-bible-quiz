# Language Readiness Matrix

`Enabled` means visible to Version 1.0 players. `Configured` means the locale can be prepared in protected translation tooling but remains absent from public selectors.

| Language | Code | V1 visibility | UI module | Local question source | Production review/content status |
|---|---|---:|---:|---:|---|
| English | en | Enabled | Full base | Yes | Canonical fallback/source; local launch content treated as published |
| Amharic | am | Enabled | Present | Yes | Database rows are publication-gated; legacy local file header still records AI-assisted text requiring native/pastoral review |
| Afaan Oromo | om | Future | Partial module | Placeholder/source file | Disabled pending reviewed coverage |
| Tigrinya | ti | Future | Partial module | Placeholder/source file | Disabled pending reviewed coverage |
| Spanish | es | Future | Partial module | Placeholder/source file | Disabled pending reviewed coverage |
| French | fr | Future | Partial module | Placeholder/source file | Disabled pending reviewed coverage |
| Arabic | ar | Future | Partial module, RTL metadata | Placeholder/source file | Disabled pending reviewed coverage and RTL QA |
| Portuguese | pt | Future | Partial module | Placeholder/source file | Disabled pending reviewed coverage |
| Swahili | sw | Future | Partial module | Placeholder/source file | Disabled pending reviewed coverage |
| Hindi | hi | Future | Partial module | Placeholder/source file | Disabled pending reviewed coverage |
| Chinese | zh | Future | Partial module | Placeholder/source file | Disabled pending reviewed coverage |
| Korean | ko | Future | Partial module | Placeholder/source file | Disabled pending reviewed coverage |
| German | de | Future | Partial module | Placeholder/source file | Disabled pending reviewed coverage |
| Italian | it | Future | Partial module | Placeholder/source file | Disabled pending reviewed coverage |
| Japanese | ja | Future | English-fallback UI module | Placeholder/source file | Disabled pending reviewed coverage |

## Mode readiness

| Mode | English | Amharic | Future locales |
|---|---|---|---|
| Interface/onboarding/settings | Enabled | Enabled | Hidden |
| Solo Quiz | Enabled | Enabled with existing content-availability guard | Hidden |
| Friends Battle | Enabled | Enabled with complete-pool guard | Hidden |
| Live Battle | Enabled | Enabled; canonical room question remains synchronized | Hidden from host/join/player selectors |
| Church Mode | Enabled | Enabled | Hidden |

## Remaining content gaps

- A native-speaking reviewer/pastor should complete and record review of the legacy Amharic local bank; the file currently discloses that its text was AI-assisted and not fully reviewed.
- Future UI modules are partial and rely on English deep-merge fallback.
- Future local question files are not evidence of publish-ready coverage. Before enablement, measure published exact-language coverage by level/category and Friends Battle pool size.
- Arabic additionally requires full RTL layout, typography, input, and native-device review.
