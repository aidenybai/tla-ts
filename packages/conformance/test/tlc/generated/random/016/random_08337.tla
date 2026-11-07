(*---
description: Evaluates a random seq expression, seed 262, number 8337.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08337 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq([[<<1, 2>> EXCEPT ![1] = 7] EXCEPT ![1] = SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)], ((CHOOSE b12896 \in SUBSET {1} : FALSE) - (0 * -1)), ((1 % 2) * (-1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 158 to line 14, col 158 of module random_08337 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 156.
    | Expression starting at line 14, column 156.
    | ExtendableExpr starting at line 14, column 155.
    | ExtendableExpr starting at line 14, column 114.
    | Expression starting at line 14, column 114.
    | Fatal errors while parsing TLA+ spec in file random_08337
    | In module random_08337
    | Could not parse module random_08337 from file random_08337.tla
    | *** Errors: 1
    | In module random_08337
    | Could not parse module random_08337 from file random_08337.tla
    3002:1 Parsing or semantic analysis failed.
---*)
