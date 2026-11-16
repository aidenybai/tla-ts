(*---
description: Groups \sqsupset against \sqsubseteq, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_sqsupset__sqsubseteq ----
EXTENDS TLC
a \sqsupset b == <<"\\sqsupset", a, b>>
a \sqsubseteq b == <<"\\sqsubseteq", a, b>>
Test == PrintT(1 \sqsupset 2 \sqsubseteq 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \sqsupset in block line 16, col 18 to line 16, col 26 of module prec_sqsupset__sqsubseteq and \sqsubseteq.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 28.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_sqsupset__sqsubseteq
    | In module prec_sqsupset__sqsubseteq
    | Could not parse module prec_sqsupset__sqsubseteq from file prec_sqsupset__sqsubseteq.tla
    | *** Errors: 1
    | In module prec_sqsupset__sqsubseteq
    | Could not parse module prec_sqsupset__sqsubseteq from file prec_sqsupset__sqsubseteq.tla
    3002:1 Parsing or semantic analysis failed.
---*)
