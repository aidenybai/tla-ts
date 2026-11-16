(*---
description: Groups \sqsubseteq against \sqsubset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsubseteq__sqsubset ----
EXTENDS TLC
a \sqsubseteq b == <<"\\sqsubseteq", a, b>>
a \sqsubset b == <<"\\sqsubset", a, b>>
Test == PrintT(1 \sqsubseteq 2 \sqsubset 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \sqsubseteq in block line 16, col 18 to line 16, col 28 of module prec_sqsubseteq__sqsubset and \sqsubset.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 30.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_sqsubseteq__sqsubset
    | In module prec_sqsubseteq__sqsubset
    | Could not parse module prec_sqsubseteq__sqsubset from file prec_sqsubseteq__sqsubset.tla
    | *** Errors: 1
    | In module prec_sqsubseteq__sqsubset
    | Could not parse module prec_sqsubseteq__sqsubset from file prec_sqsubseteq__sqsubset.tla
    3002:1 Parsing or semantic analysis failed.
---*)
