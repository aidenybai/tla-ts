(*---
description: Evaluates a random bool expression, seed 262, number 7974.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07974 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12313 \in (({b12314 \in {x \in 1..3 : x > 1} : TRUE} \cap (7 \cap Nat)) \cap (Len(<<3, 1, 2>>) .. Cardinality({}))) |-> IF (\E b12315 \in {1 : b12316 \in {1}} : (1 \in {x \in 1..3 : x > 1})) THEN ((CHOOSE b12317 \in {2, 1, 3} : 2..1) + (--1)) ELSE IF (TRUE <=> TRUE) THEN ((1 :> 2))[[x \in 1..2 |-> x]] ELSE LET b12318 == b12313 IN b12318])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 257 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 254.
    | ExtendableExpr starting at line 14, column 215.
    | Expression starting at line 14, column 215.
    | ExtendableExpr starting at line 14, column 214.
    | Expression starting at line 14, column 214.
    | Fatal errors while parsing TLA+ spec in file random_07974
    | In module random_07974
    | Could not parse module random_07974 from file random_07974.tla
    | *** Errors: 1
    | In module random_07974
    | Could not parse module random_07974 from file random_07974.tla
    3002:1 Parsing or semantic analysis failed.
---*)
