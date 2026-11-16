(*---
description: Evaluates a random int expression, seed 262, number 2488.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02488 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (SubSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), Cardinality({x \in 1..3 : x > 1}), LET b3914 == 3 IN 1) < (CHOOSE b3915 \in ({x \in 1..3 : x > 1} \cap {}) : (2147483647 < 0))) THEN ((DOMAIN <<5, 6>> % IF SUBSET {1} THEN 2 ELSE 7) + (UNION {{1}, {1, 2}} % ([a |-> 1]).a)) ELSE ((CHOOSE b3916 \in {b3917 : b3917 \in 1..3} : (<<>> = [x \in 1..2 |-> x])) - (CASE TRUE -> 3 [] OTHER -> 1 * (7 + -1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 204 to line 14, col 209 of module random_02488 and %.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 211.
    | Expression starting at line 14, column 204.
    | ExtendableExpr starting at line 14, column 203.
    | Expression starting at line 14, column 203.
    | ExtendableExpr starting at line 14, column 202.
    | Fatal errors while parsing TLA+ spec in file random_02488
    | In module random_02488
    | Could not parse module random_02488 from file random_02488.tla
    | *** Errors: 1
    | In module random_02488
    | Could not parse module random_02488 from file random_02488.tla
    3002:1 Parsing or semantic analysis failed.
---*)
