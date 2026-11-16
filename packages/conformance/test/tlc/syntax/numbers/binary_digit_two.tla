(*---
description: "A digit past 1 ends the binary literal at the lexer, which then cannot continue."
ref: tla2sany/parser/TLAplusParserTokenManager.java
features: [numbers]
outcome: parse-error
---*)
---- MODULE binary_digit_two ----
Test == \b102 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "2" at line 8, column 13 and token "\\b10" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file binary_digit_two
    | In module binary_digit_two
    | Could not parse module binary_digit_two from file binary_digit_two.tla
    | *** Errors: 1
    | In module binary_digit_two
    | Could not parse module binary_digit_two from file binary_digit_two.tla
    3002:1 Parsing or semantic analysis failed.
---*)
