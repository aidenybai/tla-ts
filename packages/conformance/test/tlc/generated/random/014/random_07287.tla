(*---
description: Evaluates a random function expression, seed 262, number 7287.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07287 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq([Append(<<1, 2>>, 1) EXCEPT ![1] = IF FALSE THEN -1 ELSE [a |-> 1, b |-> TRUE]], (Cardinality({1, 2}) + ({2, 1, 3} \cup {x \in 1..3 : x > 1})), IF (SUBSET {1} \ {2, 1, 3}) THEN (CHOOSE b11222 \in 2147483647 : TRUE) ELSE (-1 * -1)), ((-(1 * 7)) \cup ((Nat \cap 1..3) \cap {1 : b11223 \in {2, 1, 3}})), (LET b11224 == (3 + 2147483647) IN (b11224 * b11224) - Head(<<3, 3>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 254 to line 14, col 254 of module random_07287 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 252.
    | Expression starting at line 14, column 251.
    | ExtendableExpr starting at line 14, column 250.
    | Expression starting at line 14, column 250.
    | IF THEN ELSE starting at line 14, column 174.
    | Fatal errors while parsing TLA+ spec in file random_07287
    | In module random_07287
    | Could not parse module random_07287 from file random_07287.tla
    | *** Errors: 1
    | In module random_07287
    | Could not parse module random_07287 from file random_07287.tla
    3002:1 Parsing or semantic analysis failed.
---*)
