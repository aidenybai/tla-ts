(*---
description: Evaluates a random bool expression, seed 262, number 9756.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09756 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(UNION {[x \in 1..2 |-> x], {x \in 1..3 : x > 1}}) + ((--1) + CASE FALSE -> 0 [] OTHER -> 7)) % CASE ((TRUE \/ TRUE) <=> ({1} = Nat)) -> ([b15146 \in Nat |-> b15146])[Head(<<1, 2>>)] [] OTHER -> ((1 % 0) % IF FALSE THEN 3 ELSE 3)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 86 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 83.
    | Expression starting at line 14, column 83.
    | ExtendableExpr starting at line 14, column 82.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_09756
    | In module random_09756
    | Could not parse module random_09756 from file random_09756.tla
    | *** Errors: 1
    | In module random_09756
    | Could not parse module random_09756 from file random_09756.tla
    3002:1 Parsing or semantic analysis failed.
---*)
