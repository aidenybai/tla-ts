(*---
description: Infix Operator Declaration as Parameter. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/infix_op.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE infix_op_infix_operator_declaration_as_parameter ----

op(
  _ & _,
  _ && _,
  _ \approx _,
  _ := _,
  _ \asymp _,
  _ \bigcirc _,
  _ ::= _,
  _ \bullet _,
  _ \intersect _,
  _ \cap _,
  _ \cdot _,
  _ \o _,
  _ \circ _,
  _ @@ _,
  _ \cong _,
  _ \union _,
  _ \cup _,
  _ \div _,
  _ $ _,
  _ $$ _,
  _ \doteq _,
  _ .. _,
  _ ... _,
  _ = _,
  _ \equiv _,
  _ !! _,
  _ >= _,
  _ \geq _,
  _ \gg _,
  _ > _,
  _ ## _,
  _ <=> _,
  _ => _,
  _ \in _,
  _ /\ _,
  _ \land _,
  _ =| _,
  _ ~> _,
  _ <= _,
  _ =< _,
  _ \leq _,
  _ \ll _,
  _ \/ _,
  _ \lor _,
  _ -| _,
  _ < _,
  _ <: _,
  _ :> _,
  _ - _,
  _ -- _,
  _ % _,
  _ %% _,
  _ * _,
  _ ** _,
  _ /= _,
  _ # _,
  _ \notin _,
  _ (.) _,
  _ \odot _,
  _ (-) _,
  _ \ominus _,
  _ (+) _,
  _ \oplus _,
  _ (/) _,
  _ \oslash _,
  _ (\X) _,
  _ \otimes _,
  _ + _,
  _ -+-> _,
  _ ++ _,
  _ ^ _,
  _ ^^ _,
  _ \prec _,
  _ \preceq _,
  _ \propto _,
  _ ?? _,
  _ |= _,
  _ |- _,
  _ \ _,
  _ \sim _,
  _ \simeq _,
  _ / _,
  _ // _,
  _ \sqcap _,
  _ \sqcup _,
  _ \sqsubset _,
  _ \sqsubseteq _,
  _ \sqsupset _,
  _ \sqsupseteq _,
  _ \star _,
  _ \subset _,
  _ \subseteq _,
  _ \succ _,
  _ \succeq _,
  _ \supset _,
  _ \supseteq _,
  _ \uplus _,
  _ | _,
  _ || _,
  _ \wr _
) == 1

====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 30
    | line 19, col 3 to line 19, col 16 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \intersect is a built-in operator, and cannot be redefined.
    | line 20, col 3 to line 20, col 10 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \intersect is a built-in operator, and cannot be redefined.
    | line 21, col 3 to line 21, col 11 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \cdot is a built-in operator, and cannot be redefined.
    | line 23, col 3 to line 23, col 11 of module infix_op_infix_operator_declaration_as_parameter
    | Multiply-defined symbol '\o': this definition or declaration conflicts 
    | with the one at line 22, col 3 to line 22, col 8 of module infix_op_infix_operator_declaration_as_parameter.
    | line 26, col 3 to line 26, col 12 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \union is a built-in operator, and cannot be redefined.
    | line 27, col 3 to line 27, col 10 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \union is a built-in operator, and cannot be redefined.
    | line 34, col 3 to line 34, col 7 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol = is a built-in operator, and cannot be redefined.
    | line 35, col 3 to line 35, col 12 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \equiv is a built-in operator, and cannot be redefined.
    | line 38, col 3 to line 38, col 10 of module infix_op_infix_operator_declaration_as_parameter
    | Multiply-defined symbol '\geq': this definition or declaration conflicts 
    | with the one at line 37, col 3 to line 37, col 8 of module infix_op_infix_operator_declaration_as_parameter.
    | line 42, col 3 to line 42, col 9 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \equiv is a built-in operator, and cannot be redefined.
    | line 43, col 3 to line 43, col 8 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol => is a built-in operator, and cannot be redefined.
    | line 44, col 3 to line 44, col 9 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \in is a built-in operator, and cannot be redefined.
    | line 45, col 3 to line 45, col 8 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \land is a built-in operator, and cannot be redefined.
    | line 46, col 3 to line 46, col 11 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \land is a built-in operator, and cannot be redefined.
    | line 48, col 3 to line 48, col 8 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol ~> is a built-in operator, and cannot be redefined.
    | line 50, col 3 to line 50, col 8 of module infix_op_infix_operator_declaration_as_parameter
    | Multiply-defined symbol '\leq': this definition or declaration conflicts 
    | with the one at line 49, col 3 to line 49, col 8 of module infix_op_infix_operator_declaration_as_parameter.
    | line 51, col 3 to line 51, col 10 of module infix_op_infix_operator_declaration_as_parameter
    | Multiply-defined symbol '\leq': this definition or declaration conflicts 
    | with the one at line 49, col 3 to line 49, col 8 of module infix_op_infix_operator_declaration_as_parameter.
    | line 53, col 3 to line 53, col 8 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \lor is a built-in operator, and cannot be redefined.
    | line 54, col 3 to line 54, col 10 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \lor is a built-in operator, and cannot be redefined.
    | line 65, col 3 to line 65, col 8 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol /= is a built-in operator, and cannot be redefined.
    | line 66, col 3 to line 66, col 7 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol /= is a built-in operator, and cannot be redefined.
    | line 67, col 3 to line 67, col 12 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \notin is a built-in operator, and cannot be redefined.
    | line 69, col 3 to line 69, col 11 of module infix_op_infix_operator_declaration_as_parameter
    | Multiply-defined symbol '\odot': this definition or declaration conflicts 
    | with the one at line 68, col 3 to line 68, col 9 of module infix_op_infix_operator_declaration_as_parameter.
    | line 71, col 3 to line 71, col 13 of module infix_op_infix_operator_declaration_as_parameter
    | Multiply-defined symbol '\ominus': this definition or declaration conflicts 
    | with the one at line 70, col 3 to line 70, col 9 of module infix_op_infix_operator_declaration_as_parameter.
    | line 73, col 3 to line 73, col 12 of module infix_op_infix_operator_declaration_as_parameter
    | Multiply-defined symbol '\oplus': this definition or declaration conflicts 
    | with the one at line 72, col 3 to line 72, col 9 of module infix_op_infix_operator_declaration_as_parameter.
    | line 75, col 3 to line 75, col 13 of module infix_op_infix_operator_declaration_as_parameter
    | Multiply-defined symbol '\oslash': this definition or declaration conflicts 
    | with the one at line 74, col 3 to line 74, col 9 of module infix_op_infix_operator_declaration_as_parameter.
    | line 77, col 3 to line 77, col 13 of module infix_op_infix_operator_declaration_as_parameter
    | Multiply-defined symbol '\otimes': this definition or declaration conflicts 
    | with the one at line 76, col 3 to line 76, col 10 of module infix_op_infix_operator_declaration_as_parameter.
    | line 79, col 3 to line 79, col 10 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol -+-> is a built-in operator, and cannot be redefined.
    | line 89, col 3 to line 89, col 7 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \ is a built-in operator, and cannot be redefined.
    | line 102, col 3 to line 102, col 15 of module infix_op_infix_operator_declaration_as_parameter
    | Symbol \subseteq is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
