---- MODULE StringOrder_TTrace_1793058790 ----
EXTENDS Sequences, TLCExt, Toolbox, StringOrder_TEConstants, Naturals, TLC, StringOrder

_expression ==
    LET StringOrder_TEExpression == INSTANCE StringOrder_TEExpression
    IN StringOrder_TEExpression!expression
----

_trace ==
    LET StringOrder_TETrace == INSTANCE StringOrder_TETrace
    IN StringOrder_TETrace!trace
----

_inv ==
    ~(
        TLCGet("level") = Len(_TETrace)
        /\
        names = ({"zzq", "aaq", "mmq"})
        /\
        pick = ("aaq")
    )
----

_init ==
    /\ names = _TETrace[1].names
    /\ pick = _TETrace[1].pick
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
        /\ names  = _TETrace[i].names
        /\ names' = _TETrace[j].names
        /\ pick  = _TETrace[i].pick
        /\ pick' = _TETrace[j].pick

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("StringOrder_TTrace_1793058790.json", _TETrace)

=============================================================================

 Note that you can extract this module `StringOrder_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `StringOrder_TEExpression.tla` file takes precedence 
  over the module `StringOrder_TEExpression` below).

---- MODULE StringOrder_TEExpression ----
EXTENDS Sequences, TLCExt, Toolbox, StringOrder_TEConstants, Naturals, TLC, StringOrder

expression == 
    [
        \* To hide variables of the `StringOrder` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        names |-> names
        ,pick |-> pick
        
        \* Put additional constant-, state-, and action-level expressions here:
        \* ,_stateNumber |-> _TEPosition
        \* ,_namesUnchanged |-> names = names'
        
        \* Format the `names` variable as Json value.
        \* ,_namesJson |->
        \*     LET J == INSTANCE Json
        \*     IN J!ToJson(names)
        
        \* Lastly, you may build expressions over arbitrary sets of states by
        \* leveraging the _TETrace operator.  For example, this is how to
        \* count the number of times a spec variable changed up to the current
        \* state in the trace.
        \* ,_namesModCount |->
        \*     LET F[s \in DOMAIN _TETrace] ==
        \*         IF s = 1 THEN 0
        \*         ELSE IF _TETrace[s].names # _TETrace[s-1].names
        \*             THEN 1 + F[s-1] ELSE F[s-1]
        \*     IN F[_TEPosition - 1]
    ]

=============================================================================



Parsing and semantic processing can take forever if the trace below is long.
 In this case, it is advised to uncomment the module below to deserialize the
 trace from a generated binary file.

\*
\*---- MODULE StringOrder_TETrace ----
\*EXTENDS IOUtils, StringOrder_TEConstants, TLC, StringOrder
\*
\*trace == IODeserialize("StringOrder_TTrace_1793058790.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE StringOrder_TETrace ----
EXTENDS StringOrder_TEConstants, TLC, StringOrder

trace == 
    <<
    ([names |-> {"zzq", "aaq"},pick |-> "zzq"]),
    ([names |-> {"zzq", "aaq", "mmq"},pick |-> "aaq"])
    >>
----


=============================================================================

---- MODULE StringOrder_TEConstants ----
EXTENDS StringOrder

CONSTANTS p2, m, b

=============================================================================

---- CONFIG StringOrder_TTrace_1793058790 ----
CONSTANTS
    P = { p2 , m , b }
    p2 = p2
    m = m
    b = b

INVARIANT
    _inv

CHECK_DEADLOCK
    \* CHECK_DEADLOCK off because of PROPERTY or INVARIANT above.
    FALSE

INIT
    _init

NEXT
    _next

CONSTANT
    _TETrace <- _trace

ALIAS
    _expression
=============================================================================
\* Generated on Mon Oct 26 16:53:11 PDT 2026