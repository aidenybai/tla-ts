(*---
description: Groups \doteq against <=, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_doteq__less_equal ----
EXTENDS TLC
a \doteq b == <<"\\doteq", a, b>>
a <= b == <<"<=", a, b>>
Test == PrintT(1 \doteq 2 <= 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \doteq in block line 16, col 18 to line 16, col 23 of module prec_doteq__less_equal and \leq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 25.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_doteq__less_equal
    | In module prec_doteq__less_equal
    | Could not parse module prec_doteq__less_equal from file prec_doteq__less_equal.tla
    | *** Errors: 1
    | In module prec_doteq__less_equal
    | Could not parse module prec_doteq__less_equal from file prec_doteq__less_equal.tla
    3002:1 Parsing or semantic analysis failed.
---*)
