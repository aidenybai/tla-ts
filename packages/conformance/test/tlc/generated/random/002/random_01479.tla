(*---
description: Evaluates a random int expression, seed 262, number 1479.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01479 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(<<((0 \div -1) - (CHOOSE b2361 \in {1, 2} : TRUE)), (-(-1 * 3))>>, ((-([a |-> 1]).a) \div (CHOOSE b2362 \in ([x \in 1..2 |-> x] \cup 1..3) : (FALSE /\ TRUE))), ((CHOOSE b2363 \in ({x \in 1..3 : x > 1} \cap TRUE) : (b2363 = 7)) + IF (3 \in 1..3) THEN CASE TRUE -> -1 [] OTHER -> 3 ELSE (-7))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 29 to line 14, col 32 of module random_01479 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 27.
    | Expression starting at line 14, column 27.
    | ExtendableExpr starting at line 14, column 26.
    | Expression starting at line 14, column 26.
    | ExtendableExpr starting at line 14, column 25.
    | Fatal errors while parsing TLA+ spec in file random_01479
    | In module random_01479
    | Could not parse module random_01479 from file random_01479.tla
    | *** Errors: 1
    | In module random_01479
    | Could not parse module random_01479 from file random_01479.tla
    3002:1 Parsing or semantic analysis failed.
---*)
