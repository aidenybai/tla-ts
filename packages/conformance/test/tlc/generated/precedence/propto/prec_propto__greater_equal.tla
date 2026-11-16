(*---
description: Groups \propto against >=, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_propto__greater_equal ----
EXTENDS TLC
a \propto b == <<"\\propto", a, b>>
a >= b == <<">=", a, b>>
Test == PrintT(1 \propto 2 >= 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \propto in block line 16, col 18 to line 16, col 24 of module prec_propto__greater_equal and \geq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 26.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_propto__greater_equal
    | In module prec_propto__greater_equal
    | Could not parse module prec_propto__greater_equal from file prec_propto__greater_equal.tla
    | *** Errors: 1
    | In module prec_propto__greater_equal
    | Could not parse module prec_propto__greater_equal from file prec_propto__greater_equal.tla
    3002:1 Parsing or semantic analysis failed.
---*)
