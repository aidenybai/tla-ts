(*---
description: "Decimal No Leading Zero (GH tlaplus/tlaplus #596). Ported from SANY's syntax corpus."
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/old_syntax.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE old_syntax_decimal_no_leading_zero_gh_tlaplus_tlaplus_596 ----
op == .5
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Expression or Instance"
    | Encountered "." at line 9, column 7 and token "==" 
    | Residual stack trace follows:
    | Definition starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Module definition starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file old_syntax_decimal_no_leading_zero_gh_tlaplus_tlaplus_596
    | In module old_syntax_decimal_no_leading_zero_gh_tlaplus_tlaplus_596
    | Could not parse module old_syntax_decimal_no_leading_zero_gh_tlaplus_tlaplus_596 from file old_syntax_decimal_no_leading_zero_gh_tlaplus_tlaplus_596.tla
    | *** Errors: 1
    | In module old_syntax_decimal_no_leading_zero_gh_tlaplus_tlaplus_596
    | Could not parse module old_syntax_decimal_no_leading_zero_gh_tlaplus_tlaplus_596 from file old_syntax_decimal_no_leading_zero_gh_tlaplus_tlaplus_596.tla
    3002:1 Parsing or semantic analysis failed.
---*)
