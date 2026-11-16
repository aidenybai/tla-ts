(*---
description: "⊢ is only an infix operator, so it has no prefix use in a theorem."
ref: "tla2sany/parser/TLAplusParser.java#Theorem"
features: [unicode]
outcome: parse-error
---*)
---- MODULE turnstile_in_theorem_is_infix ----
THEOREM ⊢ TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "TRUE" at line 8, column 11 and token "\u22a2" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file turnstile_in_theorem_is_infix
    | In module turnstile_in_theorem_is_infix
    | Could not parse module turnstile_in_theorem_is_infix from file turnstile_in_theorem_is_infix.tla
    | *** Errors: 1
    | In module turnstile_in_theorem_is_infix
    | Could not parse module turnstile_in_theorem_is_infix from file turnstile_in_theorem_is_infix.tla
    3002:1 Parsing or semantic analysis failed.
---*)
