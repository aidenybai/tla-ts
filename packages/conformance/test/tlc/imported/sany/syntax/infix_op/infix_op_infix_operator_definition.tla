(*---
description: Infix Operator Definition. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/infix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE infix_op_infix_operator_definition ----

x & y == 0
x && y == 1
x \approx y == 2
x := y == 3
x \asymp y == 4
x \bigcirc y == 5
x ::= y == 6
x \bullet y == 7
x \intersect y == 8
x \cap y == 9
x \cdot y == 10
x \o y == 11
x \circ y == 12
x @@ y == 13
x \cong y == 14
x \union y == 15
x \cup y == 16
x \div y == 17
x $ y == 18
x $$ y == 19
x \doteq y == 20
x .. y == 21
x ... y == 22
x = y == 23
x \equiv y == 24
x !! y == 25
x >= y == 26
x \geq y == 27
x \gg y == 28
x > y == 29
x ## y == 30
x <=> y == 31
x => y == 32
x \in y == 33
x /\ y == 34
x \land y == 35
x =| y == 36
x ~> y == 37
x <= y == 38
x =< y == 39
x \leq y == 40
x \ll y == 41
x \/ y == 42
x \lor y == 43
x -| y == 44
x < y == 45
x <: y == 46
x :> y == 47
x - y == 48
x -- y == 49
x % y == 50
x %% y == 51
x * y == 52
x ** y == 53
x /= y == 54
x # y == 55
x \notin y == 56
x (.) y == 57
x \odot y == 58
x (-) y == 59
x \ominus y == 60
x (+) y == 61
x \oplus y == 62
x (/) y == 63
x \oslash y == 64
x (\X) y == 65
x \otimes y == 66
x + y == 67
x -+-> y == 68
x ++ y == 69
x ^ y == 70
x ^^ y == 71
x \prec y == 72
x \preceq y == 73
x \propto y == 74
x ?? y == 75
x |= y == 76
x |- y == 77
x \ y == 78
x \sim y == 79
x \simeq y == 80
x / y == 81
x // y == 82
x \sqcap y == 83
x \sqcup y == 84
x \sqsubset y == 85
x \sqsubseteq y == 86
x \sqsupset y == 87
x \sqsupseteq y == 88
x \star y == 89
x \subset y == 90
x \subseteq y == 91
x \succ y == 92
x \succeq y == 93
x \supset y == 94
x \supseteq y == 95
x \uplus y == 98
x | y == 99
x || y == 100
x \wr y == 101

====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 9
    | line 22, col 1 to line 22, col 15 of module infix_op_infix_operator_definition
    | Multiple declarations or definitions for symbol \o.  
    | This duplicates the one at line 21, col 1 to line 21, col 12 of module infix_op_infix_operator_definition.
    | line 37, col 1 to line 37, col 14 of module infix_op_infix_operator_definition
    | Multiple declarations or definitions for symbol \geq.  
    | This duplicates the one at line 36, col 1 to line 36, col 12 of module infix_op_infix_operator_definition.
    | line 49, col 1 to line 49, col 12 of module infix_op_infix_operator_definition
    | Multiple declarations or definitions for symbol \leq.  
    | This duplicates the one at line 48, col 1 to line 48, col 12 of module infix_op_infix_operator_definition.
    | line 50, col 1 to line 50, col 14 of module infix_op_infix_operator_definition
    | Multiple declarations or definitions for symbol \leq.  
    | This duplicates the one at line 48, col 1 to line 48, col 12 of module infix_op_infix_operator_definition.
    | line 68, col 1 to line 68, col 15 of module infix_op_infix_operator_definition
    | Multiple declarations or definitions for symbol \odot.  
    | This duplicates the one at line 67, col 1 to line 67, col 13 of module infix_op_infix_operator_definition.
    | line 70, col 1 to line 70, col 17 of module infix_op_infix_operator_definition
    | Multiple declarations or definitions for symbol \ominus.  
    | This duplicates the one at line 69, col 1 to line 69, col 13 of module infix_op_infix_operator_definition.
    | line 72, col 1 to line 72, col 16 of module infix_op_infix_operator_definition
    | Multiple declarations or definitions for symbol \oplus.  
    | This duplicates the one at line 71, col 1 to line 71, col 13 of module infix_op_infix_operator_definition.
    | line 74, col 1 to line 74, col 17 of module infix_op_infix_operator_definition
    | Multiple declarations or definitions for symbol \oslash.  
    | This duplicates the one at line 73, col 1 to line 73, col 13 of module infix_op_infix_operator_definition.
    | line 76, col 1 to line 76, col 17 of module infix_op_infix_operator_definition
    | Multiple declarations or definitions for symbol \otimes.  
    | This duplicates the one at line 75, col 1 to line 75, col 14 of module infix_op_infix_operator_definition.
    | Semantic errors:
    | *** Errors: 51
    | line 18, col 1 to line 18, col 19 of module infix_op_infix_operator_definition
    | Operator \intersect already defined or declared.
    | line 18, col 1 to line 18, col 19 of module infix_op_infix_operator_definition
    | Symbol \intersect is a built-in operator, and cannot be redefined.
    | line 19, col 1 to line 19, col 13 of module infix_op_infix_operator_definition
    | Operator \intersect already defined or declared.
    | line 19, col 1 to line 19, col 13 of module infix_op_infix_operator_definition
    | Symbol \intersect is a built-in operator, and cannot be redefined.
    | line 20, col 1 to line 20, col 15 of module infix_op_infix_operator_definition
    | Operator \cdot already defined or declared.
    | line 20, col 1 to line 20, col 15 of module infix_op_infix_operator_definition
    | Symbol \cdot is a built-in operator, and cannot be redefined.
    | line 22, col 1 to line 22, col 15 of module infix_op_infix_operator_definition
    | Operator \o already defined or declared.
    | line 25, col 1 to line 25, col 16 of module infix_op_infix_operator_definition
    | Operator \union already defined or declared.
    | line 25, col 1 to line 25, col 16 of module infix_op_infix_operator_definition
    | Symbol \union is a built-in operator, and cannot be redefined.
    | line 26, col 1 to line 26, col 14 of module infix_op_infix_operator_definition
    | Operator \union already defined or declared.
    | line 26, col 1 to line 26, col 14 of module infix_op_infix_operator_definition
    | Symbol \union is a built-in operator, and cannot be redefined.
    | line 33, col 1 to line 33, col 11 of module infix_op_infix_operator_definition
    | Operator = already defined or declared.
    | line 33, col 1 to line 33, col 11 of module infix_op_infix_operator_definition
    | Symbol = is a built-in operator, and cannot be redefined.
    | line 34, col 1 to line 34, col 16 of module infix_op_infix_operator_definition
    | Operator \equiv already defined or declared.
    | line 34, col 1 to line 34, col 16 of module infix_op_infix_operator_definition
    | Symbol \equiv is a built-in operator, and cannot be redefined.
    | line 37, col 1 to line 37, col 14 of module infix_op_infix_operator_definition
    | Operator \geq already defined or declared.
    | line 41, col 1 to line 41, col 13 of module infix_op_infix_operator_definition
    | Operator \equiv already defined or declared.
    | line 41, col 1 to line 41, col 13 of module infix_op_infix_operator_definition
    | Symbol \equiv is a built-in operator, and cannot be redefined.
    | line 42, col 1 to line 42, col 12 of module infix_op_infix_operator_definition
    | Operator => already defined or declared.
    | line 42, col 1 to line 42, col 12 of module infix_op_infix_operator_definition
    | Symbol => is a built-in operator, and cannot be redefined.
    | line 43, col 1 to line 43, col 13 of module infix_op_infix_operator_definition
    | Operator \in already defined or declared.
    | line 43, col 1 to line 43, col 13 of module infix_op_infix_operator_definition
    | Symbol \in is a built-in operator, and cannot be redefined.
    | line 44, col 1 to line 44, col 12 of module infix_op_infix_operator_definition
    | Operator \land already defined or declared.
    | line 44, col 1 to line 44, col 12 of module infix_op_infix_operator_definition
    | Symbol \land is a built-in operator, and cannot be redefined.
    | line 45, col 1 to line 45, col 15 of module infix_op_infix_operator_definition
    | Operator \land already defined or declared.
    | line 45, col 1 to line 45, col 15 of module infix_op_infix_operator_definition
    | Symbol \land is a built-in operator, and cannot be redefined.
    | line 47, col 1 to line 47, col 12 of module infix_op_infix_operator_definition
    | Operator ~> already defined or declared.
    | line 47, col 1 to line 47, col 12 of module infix_op_infix_operator_definition
    | Symbol ~> is a built-in operator, and cannot be redefined.
    | line 49, col 1 to line 49, col 12 of module infix_op_infix_operator_definition
    | Operator \leq already defined or declared.
    | line 50, col 1 to line 50, col 14 of module infix_op_infix_operator_definition
    | Operator \leq already defined or declared.
    | line 52, col 1 to line 52, col 12 of module infix_op_infix_operator_definition
    | Operator \lor already defined or declared.
    | line 52, col 1 to line 52, col 12 of module infix_op_infix_operator_definition
    | Symbol \lor is a built-in operator, and cannot be redefined.
    | line 53, col 1 to line 53, col 14 of module infix_op_infix_operator_definition
    | Operator \lor already defined or declared.
    | line 53, col 1 to line 53, col 14 of module infix_op_infix_operator_definition
    | Symbol \lor is a built-in operator, and cannot be redefined.
    | line 64, col 1 to line 64, col 12 of module infix_op_infix_operator_definition
    | Operator /= already defined or declared.
    | line 64, col 1 to line 64, col 12 of module infix_op_infix_operator_definition
    | Symbol /= is a built-in operator, and cannot be redefined.
    | line 65, col 1 to line 65, col 11 of module infix_op_infix_operator_definition
    | Operator /= already defined or declared.
    | line 65, col 1 to line 65, col 11 of module infix_op_infix_operator_definition
    | Symbol /= is a built-in operator, and cannot be redefined.
    | line 66, col 1 to line 66, col 16 of module infix_op_infix_operator_definition
    | Operator \notin already defined or declared.
    | line 66, col 1 to line 66, col 16 of module infix_op_infix_operator_definition
    | Symbol \notin is a built-in operator, and cannot be redefined.
    | line 68, col 1 to line 68, col 15 of module infix_op_infix_operator_definition
    | Operator \odot already defined or declared.
    | line 70, col 1 to line 70, col 17 of module infix_op_infix_operator_definition
    | Operator \ominus already defined or declared.
    | line 72, col 1 to line 72, col 16 of module infix_op_infix_operator_definition
    | Operator \oplus already defined or declared.
    | line 74, col 1 to line 74, col 17 of module infix_op_infix_operator_definition
    | Operator \oslash already defined or declared.
    | line 76, col 1 to line 76, col 17 of module infix_op_infix_operator_definition
    | Operator \otimes already defined or declared.
    | line 78, col 1 to line 78, col 14 of module infix_op_infix_operator_definition
    | Operator -+-> already defined or declared.
    | line 78, col 1 to line 78, col 14 of module infix_op_infix_operator_definition
    | Symbol -+-> is a built-in operator, and cannot be redefined.
    | line 88, col 1 to line 88, col 11 of module infix_op_infix_operator_definition
    | Operator \ already defined or declared.
    | line 88, col 1 to line 88, col 11 of module infix_op_infix_operator_definition
    | Symbol \ is a built-in operator, and cannot be redefined.
    | line 101, col 1 to line 101, col 19 of module infix_op_infix_operator_definition
    | Operator \subseteq already defined or declared.
    | line 101, col 1 to line 101, col 19 of module infix_op_infix_operator_definition
    | Symbol \subseteq is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
