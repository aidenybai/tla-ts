(*---
description: "Digits alone are a number, so they cannot be defined."
ref: "tla2sany/parser/TLAplusParserConstants.java#IDENTIFIER"
features: [identifiers]
outcome: parse-error
---*)
---- MODULE only_digits ----
12 == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "Beginning of definition 12" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file only_digits
    | In module only_digits
    | Could not parse module only_digits from file only_digits.tla
    | *** Errors: 1
    | In module only_digits
    | Could not parse module only_digits from file only_digits.tla
    3002:1 Parsing or semantic analysis failed.
---*)
