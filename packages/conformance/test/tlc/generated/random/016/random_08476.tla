(*---
description: Evaluates a random seq expression, seed 262, number 8476.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08476 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq([SubSeq(<<3, 1, 2>>, 0, 2) EXCEPT ![1] = CASE FALSE -> -1 [] OTHER -> -1], LAMBDA p, q : p < q) \o [[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] EXCEPT !.a = @ + (2 \div -1)] EXCEPT ![1] = ((3 :> 0))[(3 % 1)]]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 189 to line 14, col 192 of module random_08476 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 187.
    | Expression starting at line 14, column 187.
    | ExtendableExpr starting at line 14, column 186.
    | ExtendableExpr starting at line 14, column 182.
    | Expression starting at line 14, column 182.
    | Fatal errors while parsing TLA+ spec in file random_08476
    | In module random_08476
    | Could not parse module random_08476 from file random_08476.tla
    | *** Errors: 1
    | In module random_08476
    | Could not parse module random_08476 from file random_08476.tla
    3002:1 Parsing or semantic analysis failed.
---*)
