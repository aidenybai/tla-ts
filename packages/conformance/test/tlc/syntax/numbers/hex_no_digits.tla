(*---
description: "\\h with no digits is not a literal."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [numbers]
outcome: parse-error
---*)
---- MODULE hex_no_digits ----
Test == \h = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "h" at line 8, column 10 and token "\\" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file hex_no_digits
    | In module hex_no_digits
    | Could not parse module hex_no_digits from file hex_no_digits.tla
    | *** Errors: 1
    | In module hex_no_digits
    | Could not parse module hex_no_digits from file hex_no_digits.tla
    3002:1 Parsing or semantic analysis failed.
---*)
