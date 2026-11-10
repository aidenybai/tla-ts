(*---
description: Evaluates a random seq expression, seed 262, number 3582.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03582 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Head(SubSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), (7 % 1), (CHOOSE b5649 \in Nat : TRUE))) EXCEPT ![1] = ((-(2147483647 \div -1)) - ([[x \in 1..2 |-> x] EXCEPT ![0] = 1]).a)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 138 to line 14, col 141 of module random_03582 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 127.
    | Expression starting at line 14, column 127.
    | ExtendableExpr starting at line 14, column 126.
    | Expression starting at line 14, column 125.
    | ExtendableExpr starting at line 14, column 124.
    | Fatal errors while parsing TLA+ spec in file random_03582
    | In module random_03582
    | Could not parse module random_03582 from file random_03582.tla
    | *** Errors: 1
    | In module random_03582
    | Could not parse module random_03582 from file random_03582.tla
    3002:1 Parsing or semantic analysis failed.
---*)
