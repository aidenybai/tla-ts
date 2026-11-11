(*---
description: A letter past f cannot appear in a hex literal.
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [numbers]
outcome: parse-error
---*)
---- MODULE hex_digit_g ----
Test == \h1g = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "g" at line 8, column 12 and token "\\h1" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file hex_digit_g
    | In module hex_digit_g
    | Could not parse module hex_digit_g from file hex_digit_g.tla
    | *** Errors: 1
    | In module hex_digit_g
    | Could not parse module hex_digit_g from file hex_digit_g.tla
    3002:1 Parsing or semantic analysis failed.
---*)
