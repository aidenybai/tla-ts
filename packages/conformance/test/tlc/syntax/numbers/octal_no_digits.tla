(*---
description: "\\o with no digits is the composition operator, not a literal, so it has no left operand here."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [numbers]
outcome: parse-error
---*)
---- MODULE octal_no_digits ----
Test == \o = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 10 of module octal_no_digits
    | Unknown operator: `\o'.
    3002:1 Parsing or semantic analysis failed.
---*)
