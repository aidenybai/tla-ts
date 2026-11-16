(*---
description: Evaluates a random seq expression, seed 262, number 5207.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05207 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(Tail(SubSeq(<<3, 1, 2>>, 1, 1)), Head(Append(<<3, 1, 2>>, 3)), ((3 + 3) - Head(<<1, 2>>))) \o SubSeq(SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), (CHOOSE b8080 \in {1, 2} : TRUE), ([a |-> 1]).a), (IF TRUE THEN -1 ELSE 3 * IF FALSE THEN 3 ELSE 0), IF Tail(<<>>) THEN ([x \in Nat |-> x + 1])[0] ELSE (2147483647 \div -1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 333 to line 14, col 336 of module random_05207 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 322.
    | Expression starting at line 14, column 322.
    | ExtendableExpr starting at line 14, column 321.
    | Expression starting at line 14, column 321.
    | IF THEN ELSE starting at line 14, column 270.
    | Fatal errors while parsing TLA+ spec in file random_05207
    | In module random_05207
    | Could not parse module random_05207 from file random_05207.tla
    | *** Errors: 1
    | In module random_05207
    | Could not parse module random_05207 from file random_05207.tla
    3002:1 Parsing or semantic analysis failed.
---*)
