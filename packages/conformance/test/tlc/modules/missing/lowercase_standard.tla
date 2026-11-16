(*---
description: Standard names are case sensitive.
ref: "tla2sany/modanalyzer/SpecObj.java#findOrCreateParsedUnit"
features: [missing]
outcome: parse-error
---*)
---- MODULE lowercase_standard ----
EXTENDS naturals
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file lowercase_standard
    | In module lowercase_standard
    | Cannot find source file for module naturals imported in module lowercase_standard.
    | *** Errors: 1
    | In module lowercase_standard
    | Cannot find source file for module naturals imported in module lowercase_standard.
    3002:1 Parsing or semantic analysis failed.
---*)
