(*---
description: Groups \supseteq against \doteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_supseteq__doteq ----
EXTENDS TLC
a \supseteq b == <<"\\supseteq", a, b>>
a \doteq b == <<"\\doteq", a, b>>
Test == PrintT(1 \supseteq 2 \doteq 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \supseteq in block line 16, col 18 to line 16, col 26 of module prec_supseteq__doteq and \doteq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 28.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_supseteq__doteq
    | In module prec_supseteq__doteq
    | Could not parse module prec_supseteq__doteq from file prec_supseteq__doteq.tla
    | *** Errors: 1
    | In module prec_supseteq__doteq
    | Could not parse module prec_supseteq__doteq from file prec_supseteq__doteq.tla
    3002:1 Parsing or semantic analysis failed.
---*)
