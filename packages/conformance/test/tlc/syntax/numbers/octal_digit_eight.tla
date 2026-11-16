(*---
description: A digit past 7 cannot appear in an octal literal.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [numbers]
outcome: parse-error
---*)
---- MODULE octal_digit_eight ----
Test == \o78 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "8" at line 8, column 12 and token "\\o7" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file octal_digit_eight
    | In module octal_digit_eight
    | Could not parse module octal_digit_eight from file octal_digit_eight.tla
    | *** Errors: 1
    | In module octal_digit_eight
    | Could not parse module octal_digit_eight from file octal_digit_eight.tla
    3002:1 Parsing or semantic analysis failed.
---*)
