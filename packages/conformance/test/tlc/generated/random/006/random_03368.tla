(*---
description: Evaluates a random set expression, seed 262, number 3368.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03368 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((SUBSET {1} \cap [a |-> 1, b |-> TRUE]) \ (<<1>> \cap {x \in 1..3 : x > 1})) \ (Head(<<1, 2>>) \cup (-1 .. 2))) \cap {IF ({1, 2} \subseteq {1}) THEN (--1) ELSE CASE FALSE -> 2 [] OTHER -> 1, IF (\E b5347 \in 2..1 : [a |-> 1]) THEN CASE TRUE -> FALSE [] OTHER -> 7 ELSE (CHOOSE b5348 \in {1, 2} : [a |-> 1, b |-> TRUE])}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 171 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 168.
    | Expression starting at line 14, column 168.
    | IF THEN ELSE starting at line 14, column 137.
    | Expression starting at line 14, column 137.
    | Some { } form starting at line 14, column 136.
    | Fatal errors while parsing TLA+ spec in file random_03368
    | In module random_03368
    | Could not parse module random_03368 from file random_03368.tla
    | *** Errors: 1
    | In module random_03368
    | Could not parse module random_03368 from file random_03368.tla
    3002:1 Parsing or semantic analysis failed.
---*)
