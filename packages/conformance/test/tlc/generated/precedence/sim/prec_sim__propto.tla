(*---
description: Groups \sim against \propto, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sim__propto ----
EXTENDS TLC
a \sim b == <<"\\sim", a, b>>
a \propto b == <<"\\propto", a, b>>
Test == PrintT(1 \sim 2 \propto 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \sim in block line 16, col 18 to line 16, col 21 of module prec_sim__propto and \propto.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 23.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_sim__propto
    | In module prec_sim__propto
    | Could not parse module prec_sim__propto from file prec_sim__propto.tla
    | *** Errors: 1
    | In module prec_sim__propto
    | Could not parse module prec_sim__propto from file prec_sim__propto.tla
    3002:1 Parsing or semantic analysis failed.
---*)
