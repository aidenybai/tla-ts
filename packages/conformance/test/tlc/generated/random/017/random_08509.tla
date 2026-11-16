(*---
description: Evaluates a random seq expression, seed 262, number 8509.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08509 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SubSeq(SubSeq(SubSeq(<<3, 1, 2>>, 7, 7), (-2), ([x \in Nat |-> x + 1])[2]), (CHOOSE b13184 \in {b13185 \in {1} : TRUE} : (-1 = TRUE)), ((2147483647 \div -1) % Head(<<1, 2>>))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 174 to line 14, col 177 of module random_08509 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 163.
    | Expression starting at line 14, column 163.
    | ExtendableExpr starting at line 14, column 162.
    | Expression starting at line 14, column 162.
    | ExtendableExpr starting at line 14, column 161.
    | Fatal errors while parsing TLA+ spec in file random_08509
    | In module random_08509
    | Could not parse module random_08509 from file random_08509.tla
    | *** Errors: 1
    | In module random_08509
    | Could not parse module random_08509 from file random_08509.tla
    3002:1 Parsing or semantic analysis failed.
---*)
