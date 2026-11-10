(*---
description: Evaluates a random seq expression, seed 262, number 2070.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02070 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<((0 :> 2147483647) \cup UNION {{2, 1, 3}, {}}), (CHOOSE b3296 \in {b3297 \in {1} : FALSE} : (~FALSE))>>, (LET b3298 == IF FALSE THEN 1 ELSE 2147483647 IN (--1) + CASE (FALSE /\ FALSE) -> CASE FALSE -> -1 [] OTHER -> <<>> [] OTHER -> (3 % 1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 182 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 179.
    | Expression starting at line 14, column 179.
    | Case Other Arm starting at line 14, column 131.
    | Expression starting at line 14, column 131.
    | ExtendableExpr starting at line 14, column 130.
    | Fatal errors while parsing TLA+ spec in file random_02070
    | In module random_02070
    | Could not parse module random_02070 from file random_02070.tla
    | *** Errors: 1
    | In module random_02070
    | Could not parse module random_02070 from file random_02070.tla
    3002:1 Parsing or semantic analysis failed.
---*)
