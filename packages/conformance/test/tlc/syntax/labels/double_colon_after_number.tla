(*---
description: "`::` cannot follow a number."
ref: "tla2sany/parser/TLAplusParser.java#isLabel"
features: [labels]
outcome: parse-error
---*)
---- MODULE double_colon_after_number ----
Op == 1 :: 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | `::' at line 8, col 9 to line 8, col 10 of module double_colon_after_number does not follow a label.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 7.
    | Expression starting at line 8, column 7.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file double_colon_after_number
    | In module double_colon_after_number
    | Could not parse module double_colon_after_number from file double_colon_after_number.tla
    | *** Errors: 1
    | In module double_colon_after_number
    | Could not parse module double_colon_after_number from file double_colon_after_number.tla
    3002:1 Parsing or semantic analysis failed.
---*)
