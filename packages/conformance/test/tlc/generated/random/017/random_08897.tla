(*---
description: Evaluates a random function expression, seed 262, number 8897.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08897 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b13777 \in {CASE TRUE -> 3 [] OTHER -> {1, 2} : b13778 \in [a |-> 2, b |-> FALSE]} |-> IF (~TRUE) THEN ([x \in Nat |-> x + 1])[b13777] ELSE (--1)] EXCEPT ![((-Head(<<1>>)) + Len(Tail(<<1, 2>>)))] = IF (([a |-> 1])[1] \in (1 .. 7)) THEN CASE (FALSE <=> (1 :> 2)) -> (2 - 2) [] OTHER -> (CHOOSE b13779 \in {} : TRUE) ELSE ([(1 :> 2) EXCEPT ![2] = 2147483647])[(CHOOSE b13780 \in {1, 2} : FALSE)]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 161 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 158.
    | Expression starting at line 14, column 158.
    | IF THEN ELSE starting at line 14, column 105.
    | Expression starting at line 14, column 105.
    | Some [] Form starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_08897
    | In module random_08897
    | Could not parse module random_08897 from file random_08897.tla
    | *** Errors: 1
    | In module random_08897
    | Could not parse module random_08897 from file random_08897.tla
    3002:1 Parsing or semantic analysis failed.
---*)
