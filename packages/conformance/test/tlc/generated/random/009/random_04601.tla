(*---
description: Evaluates a random int expression, seed 262, number 4601.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04601 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\E b7207 \in {(--1) : b7208 \in DOMAIN [x \in Nat |-> x + 1]} : (Tail(<<>>) = [(1 :> 2) EXCEPT ![2147483647] = 1])) THEN ((Tail(<<1>>) = (CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE)) + ((CHOOSE f \in [{1, 2} -> {1}] : TRUE))[CASE FALSE -> 2147483647 [] OTHER -> 1]) ELSE (CASE (FALSE \/ TRUE) -> (3 - -1) [] OTHER -> ([a |-> 1]).a \div ((<<1>> - 2147483647) + Len(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 37 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 34.
    | Expression starting at line 14, column 34.
    | Some { } form starting at line 14, column 33.
    | ExtendableExpr starting at line 14, column 33.
    | Expression starting at line 14, column 33.
    | Fatal errors while parsing TLA+ spec in file random_04601
    | In module random_04601
    | Could not parse module random_04601 from file random_04601.tla
    | *** Errors: 1
    | In module random_04601
    | Could not parse module random_04601 from file random_04601.tla
    3002:1 Parsing or semantic analysis failed.
---*)
