(*---
description: Evaluates a random int expression, seed 262, number 2843.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02843 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b4509 \in ((1 \div -1) :> (7 \div 3)) : ((7 .. 3) = UNION {{x \in 1..3 : x > 1}, SUBSET {1}})) % (Head(Tail(<<>>)) - Head([<<>> EXCEPT ![1] = 2147483647]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 39 to line 14, col 42 of module random_02843 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 37.
    | Expression starting at line 14, column 37.
    | ExtendableExpr starting at line 14, column 36.
    | Expression starting at line 14, column 36.
    | ExtendableExpr starting at line 14, column 35.
    | Fatal errors while parsing TLA+ spec in file random_02843
    | In module random_02843
    | Could not parse module random_02843 from file random_02843.tla
    | *** Errors: 1
    | In module random_02843
    | Could not parse module random_02843 from file random_02843.tla
    3002:1 Parsing or semantic analysis failed.
---*)
