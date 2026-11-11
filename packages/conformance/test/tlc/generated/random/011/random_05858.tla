(*---
description: Evaluates a random seq expression, seed 262, number 5858.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05858 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<IF ([a |-> 1, b |-> TRUE] = [a |-> 1]) THEN Cardinality(Nat) ELSE (1 * -1), [([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) EXCEPT ![Head([a |-> 1])] = (CHOOSE r \in [a : {0} \cup {1}] : TRUE)]>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 95 to line 14, col 95 of module random_05858 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 93.
    | Expression starting at line 14, column 93.
    | ExtendableExpr starting at line 14, column 92.
    | Expression starting at line 14, column 92.
    | IF THEN ELSE starting at line 14, column 26.
    | Fatal errors while parsing TLA+ spec in file random_05858
    | In module random_05858
    | Could not parse module random_05858 from file random_05858.tla
    | *** Errors: 1
    | In module random_05858
    | Could not parse module random_05858 from file random_05858.tla
    3002:1 Parsing or semantic analysis failed.
---*)
