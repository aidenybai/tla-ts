(*---
description: Groups \propto against \propto, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_propto__propto ----
EXTENDS TLC
a \propto b == <<"\\propto", a, b>>
Test == PrintT(1 \propto 2 \propto 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \propto in block line 15, col 18 to line 15, col 24 of module prec_propto__propto and \propto.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 15, column 26.
    | ExtendableExpr starting at line 15, column 16.
    | Expression starting at line 15, column 16.
    | Optional Arguments starting at line 15, column 15.
    | Primitive expression starting at line 15, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_propto__propto
    | In module prec_propto__propto
    | Could not parse module prec_propto__propto from file prec_propto__propto.tla
    | *** Errors: 1
    | In module prec_propto__propto
    | Could not parse module prec_propto__propto from file prec_propto__propto.tla
    3002:1 Parsing or semantic analysis failed.
---*)
