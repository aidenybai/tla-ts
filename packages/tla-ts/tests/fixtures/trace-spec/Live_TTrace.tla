---- MODULE te ----
EXTENDS Sequences, TLCExt, Toolbox, Live, Live_TEConstants, Naturals, TLC

_expression ==
    LET Live_TEExpression == INSTANCE Live_TEExpression
    IN Live_TEExpression!expression
----

_trace ==
    LET Live_TETrace == INSTANCE Live_TETrace
    IN Live_TETrace!trace
----

_prop ==
    ~(([]<>(
            x = (2)
    ))/\([]<>(
            x = (0)
    )))
----

_init ==
    /\ x = _TETrace[1].x
----

_next ==
    /\ \E i,j \in DOMAIN _TETrace:
        /\ \/ /\ j = i + 1
              /\ i = TLCGet("level")
           \/ /\ i = _TTraceLassoEnd
              /\ j = _TTraceLassoStart
        /\ x  = _TETrace[i].x
        /\ x' = _TETrace[j].x

\* Uncomment the ASSUME below to write the states of the error trace
\* to the given file in Json format. Note that you can pass any tuple
\* to `JsonSerialize`. For example, a sub-sequence of _TETrace.
    \* ASSUME
    \*     LET J == INSTANCE Json
    \*         IN J!JsonSerialize("te.json", _TETrace)

=============================================================================

 Note that you can extract this module `Live_TEExpression`
  to a dedicated file to reuse `expression` (the module in the 
  dedicated `Live_TEExpression.tla` file takes precedence 
  over the module `Live_TEExpression` below).

---- MODULE Live_TEExpression ----
EXTENDS Sequences, TLCExt, Toolbox, Live, Live_TEConstants, Naturals, TLC

expression == 
    [
        \* To hide variables of the `Live` spec from the error trace,
        \* remove the variables below.  The trace will be written in the order
        \* of the fields of this record.
        x |-> x
        
        \* Put additional constant-, state-, and action-level expressions here:
        \* ,_stateNumber |-> _TEPosition
        \* ,_xUnchanged |-> x = x'
        
        \* Format the `x` variable as Json value.
        \* ,_xJson |->
        \*     LET J == INSTANCE Json
        \*     IN J!ToJson(x)
        
        \* Lastly, you may build expressions over arbitrary sets of states by
        \* leveraging the _TETrace operator.  For example, this is how to
        \* count the number of times a spec variable changed up to the current
        \* state in the trace.
        \* ,_xModCount |->
        \*     LET F[s \in DOMAIN _TETrace] ==
        \*         IF s = 1 THEN 0
        \*         ELSE IF _TETrace[s].x # _TETrace[s-1].x
        \*             THEN 1 + F[s-1] ELSE F[s-1]
        \*     IN F[_TEPosition - 1]
    ]

=============================================================================



Parsing and semantic processing can take forever if the trace below is long.
 In this case, it is advised to uncomment the module below to deserialize the
 trace from a generated binary file.

\*
\*---- MODULE Live_TETrace ----
\*EXTENDS IOUtils, Live, Live_TEConstants, TLC
\*
\*trace == IODeserialize("te.bin", TRUE)
\*
\*=============================================================================
\*

---- MODULE Live_TETrace ----
EXTENDS Live, Live_TEConstants, TLC

trace == 
    <<
    ([x |-> 0]),
    ([x |-> 1]),
    ([x |-> 2])
    >>
----


=============================================================================

---- MODULE Live_TEConstants ----
EXTENDS Live

CONSTANTS _TTraceLassoStart, _TTraceLassoEnd

=============================================================================

---- CONFIG te ----
CONSTANTS
_TTraceLassoStart = 1
_TTraceLassoEnd = 3

PROPERTY
    _prop

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
\* Generated on Mon Nov 09 21:50:11 PST 2026