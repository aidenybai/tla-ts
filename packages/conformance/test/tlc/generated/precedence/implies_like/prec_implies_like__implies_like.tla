(*---
description: Groups -+-> against -+->, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_implies_like__implies_like ----
EXTENDS TLC
a -+-> b == <<"-+->", a, b>>
Test == PrintT(1 -+-> 2 -+-> 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops -+-> in block line 15, col 18 to line 15, col 21 of module prec_implies_like__implies_like and -+->.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 15, column 23.
    | ExtendableExpr starting at line 15, column 16.
    | Expression starting at line 15, column 16.
    | Optional Arguments starting at line 15, column 15.
    | Primitive expression starting at line 15, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_implies_like__implies_like
    | In module prec_implies_like__implies_like
    | Could not parse module prec_implies_like__implies_like from file prec_implies_like__implies_like.tla
    | *** Errors: 1
    | In module prec_implies_like__implies_like
    | Could not parse module prec_implies_like__implies_like from file prec_implies_like__implies_like.tla
    3002:1 Parsing or semantic analysis failed.
---*)
