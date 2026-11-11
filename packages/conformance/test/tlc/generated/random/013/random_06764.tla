(*---
description: Evaluates a random set expression, seed 262, number 6764.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06764 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b10370 \in UNION {SubSeq(<<0, 2>>, (SUBSET {1} % 0), (-1 - 2)), [(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = Len(<<3, 1, 2>>)]} : (LET b10371 == (-1 % b10370) IN Head(<<>>) < LET b10372 == LET b10373 == 0 IN b10370 IN ((1 :> 2))[b10372])})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 53 to line 14, col 58 of module random_06764 and %.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 60.
    | Expression starting at line 14, column 53.
    | ExtendableExpr starting at line 14, column 52.
    | Expression starting at line 14, column 52.
    | Optional Arguments starting at line 14, column 41.
    | Fatal errors while parsing TLA+ spec in file random_06764
    | In module random_06764
    | Could not parse module random_06764 from file random_06764.tla
    | *** Errors: 1
    | In module random_06764
    | Could not parse module random_06764 from file random_06764.tla
    3002:1 Parsing or semantic analysis failed.
---*)
