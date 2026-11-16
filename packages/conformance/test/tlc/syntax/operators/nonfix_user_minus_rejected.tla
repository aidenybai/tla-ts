(*---
description: "A user's binary minus gets no nonfix form either, because - before ( reads as prefix minus."
ref: "tla2sany/parser/TLAplusParser.java#Expression"
features: [operators]
outcome: parse-error
---*)
---- MODULE nonfix_user_minus_rejected ----
a - b == <<a, b>>
Test == -(1, 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "," at line 9, column 12 and token "1" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 10.
    | Expression starting at line 9, column 9.
    | Definition starting at line 9, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file nonfix_user_minus_rejected
    | In module nonfix_user_minus_rejected
    | Could not parse module nonfix_user_minus_rejected from file nonfix_user_minus_rejected.tla
    | *** Errors: 1
    | In module nonfix_user_minus_rejected
    | Could not parse module nonfix_user_minus_rejected from file nonfix_user_minus_rejected.tla
    3002:1 Parsing or semantic analysis failed.
---*)
