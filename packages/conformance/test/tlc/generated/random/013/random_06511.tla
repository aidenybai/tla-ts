(*---
description: Evaluates a random function expression, seed 262, number 6511.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06511 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE b10007 \in ((2 .. 2) \ {b10008 \in {x \in 1..3 : x > 1} : FALSE}) : (\E b10009 \in (2 .. b10007) : (TRUE /\ FALSE))) EXCEPT ![Len(SubSeq((<<>> \o <<3, 1, 2>>), Cardinality(1..3), (--1)))] = (CHOOSE b10010 \in {b10011 \in (0 .. 0) : (FALSE => FALSE)} : (DOMAIN [x \in Nat |-> x + 1] = UNION {{2, 1, 3}, {}}))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 207 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 204.
    | Expression starting at line 14, column 204.
    | Optional Arguments starting at line 14, column 161.
    | Primitive expression starting at line 14, column 155.
    | ExtendableExpr starting at line 14, column 155.
    | Fatal errors while parsing TLA+ spec in file random_06511
    | In module random_06511
    | Could not parse module random_06511 from file random_06511.tla
    | *** Errors: 1
    | In module random_06511
    | Could not parse module random_06511 from file random_06511.tla
    3002:1 Parsing or semantic analysis failed.
---*)
