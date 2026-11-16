(*---
description: Groups \simeq against \cdot, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_simeq__cdot ----
EXTENDS TLC
a \simeq b == <<"\\simeq", a, b>>
a \cdot b == <<"\\cdot", a, b>>
Test == PrintT(1 \simeq 2 \cdot 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \simeq in block line 16, col 18 to line 16, col 23 of module prec_simeq__cdot and \cdot.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 25.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_simeq__cdot
    | In module prec_simeq__cdot
    | Could not parse module prec_simeq__cdot from file prec_simeq__cdot.tla
    | *** Errors: 1
    | In module prec_simeq__cdot
    | Could not parse module prec_simeq__cdot from file prec_simeq__cdot.tla
    3002:1 Parsing or semantic analysis failed.
---*)
