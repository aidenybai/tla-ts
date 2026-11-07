(*---
description: Groups \supset against \ll, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_supset__ll ----
EXTENDS TLC
a \supset b == <<"\\supset", a, b>>
a \ll b == <<"\\ll", a, b>>
Test == PrintT(1 \supset 2 \ll 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \supset in block line 16, col 18 to line 16, col 24 of module prec_supset__ll and \ll.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 26.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_supset__ll
    | In module prec_supset__ll
    | Could not parse module prec_supset__ll from file prec_supset__ll.tla
    | *** Errors: 1
    | In module prec_supset__ll
    | Could not parse module prec_supset__ll from file prec_supset__ll.tla
    3002:1 Parsing or semantic analysis failed.
---*)
