(*---
description: Evaluates a random function expression, seed 262, number 5881.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05881 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b9071 \in DOMAIN [(1 :> 2) EXCEPT ![0] = 7] |-> CASE (<<3, 1, 2>> = (1 :> 2)) -> ([a |-> 1]).a [] OTHER -> CASE FALSE -> 1 [] OTHER -> b9071] EXCEPT ![LET b9072 == (Head(<<3, 1, 2>>) + ([x \in Nat |-> x + 1])[2147483647]) IN (Len(<<>>) - (CHOOSE b9073 \in {1} : 1..3))] = CASE (\E b9074 \in (3 .. 2) : (b9074 = 2)) -> (CHOOSE b9075 \in (SUBSET {1} \cap {}) : (~FALSE)) [] OTHER -> ((--1) % DOMAIN <<5, 6>>)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 403 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 400.
    | Expression starting at line 14, column 400.
    | ExtendableExpr starting at line 14, column 399.
    | Expression starting at line 14, column 399.
    | Case Other Arm starting at line 14, column 390.
    | Fatal errors while parsing TLA+ spec in file random_05881
    | In module random_05881
    | Could not parse module random_05881 from file random_05881.tla
    | *** Errors: 1
    | In module random_05881
    | Could not parse module random_05881 from file random_05881.tla
    3002:1 Parsing or semantic analysis failed.
---*)
