(*---
description: Evaluates a random seq expression, seed 262, number 9893.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09893 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append(SubSeq(Tail(<<1, 2>>), (-0), (-7)), (IF TRUE THEN 3 ELSE 2 % (2 \div -1))), Len(SelectSeq([<<>> EXCEPT ![1] = -1], LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 94 to line 14, col 97 of module random_09893 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 92.
    | Expression starting at line 14, column 92.
    | ExtendableExpr starting at line 14, column 91.
    | ExtendableExpr starting at line 14, column 87.
    | Expression starting at line 14, column 87.
    | Fatal errors while parsing TLA+ spec in file random_09893
    | In module random_09893
    | Could not parse module random_09893 from file random_09893.tla
    | *** Errors: 1
    | In module random_09893
    | Could not parse module random_09893 from file random_09893.tla
    3002:1 Parsing or semantic analysis failed.
---*)
