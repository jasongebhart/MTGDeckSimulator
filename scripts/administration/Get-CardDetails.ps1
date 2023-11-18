function Get-CardDetails {
    param (
        [string]$cardName
    )

    try {
        $response = Get-ScryfallCardDetail -cardName $cardName
        if ($response.object -ne "card") {
            throw "Card not found"
        }

        $rulesText = $response.oracle_text -join "`n"
        $cardType = $response.type_line

        if ($response.card_faces -and $response.card_faces.Count -gt 0) {
            $cardCost = $response.card_faces[0].mana_cost
            $cardImageUrl = $response.image_uris.normal
        } else {
            $cardCost = $response.mana_cost
            $cardImageUrl = $response.image_uris.normal
        }

        return @{
            RulesText = $rulesText;
            CardType = $cardType;
            CardCost = $cardCost;
            CardImageUrl = $cardImageUrl
            CardName = $response.name
            Scryfall_id = $response.id
        }
    } catch {
        Write-Error "Error fetching card details: $_"
        throw $_
    }
}

function Get-ScryfallCardDetail {
    param (
        [string]$cardName
    )

    $apiUrl = "https://api.scryfall.com/cards/named?fuzzy=$($cardName -replace ' ', '%20')"
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get
    return $response
}

function DownloadSymbol($name) {
    $symbol = $symbolsResponse.data | Where-Object { $_.symbol -eq $symbolName }

    if ($symbol) {
        $imageUrl = $symbol.svg_uri
        Invoke-RestMethod -Uri $imageUrl -Method Get -OutFile "$symbolName.svg"
        Write-Host "Downloaded symbol image: $symbolName"
    } else {
        Write-Host "Symbol '$symbolName' not found."
    }
}
function Get-ScryfallSymbol {
    param (
        [string]$apiUrl = "https://api.scryfall.com/symbology/"
    )
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -Method Get
        $response
    }
    catch {
        Write-Output -InputObject "Error fetching symbols: $_"
    }
}

function Get-SymbolImage {

}
<#
.SYNOPSIS
    Downloads a specific symbol image from the Scryfall API.

.DESCRIPTION
    Save-SpecificSymbol function downloads a specific symbol image from the Scryfall API based on the provided symbol name.

.PARAMETER name
    Specifies the name of the symbol to download.

.PARAMETER symbols
    Specifies the symbols object containing data from the Scryfall API.

.PARAMETER destinationDir
    Specifies the destination directory where the downloaded symbol image will be saved.

.NOTES
    File names are based on the provided symbol name with a .svg extension.
    If the file already exists in the destination directory, it won't be downloaded again.
    Use the -WhatIf parameter to simulate the download without saving the file.
#>
function Save-SpecificSymbol {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory = $true, Position = 0)]
        [string]$Name,

        [Parameter(Mandatory = $true, Position = 1)]
        [pscustomobject]$Symbols,

        [Parameter(Mandatory = $true, Position = 2)]
        [string]$DestinationDir
    )

    process {
        $symbol = $Symbols.data | Where-Object { $_.symbol -eq $Name }

        if ($symbol) {
            $ImageUrl = $Symbol.svg_uri
            $filename = Split-Path -Path $ImageUrl -Leaf
            $TargetFile = Join-Path -Path $DestinationDir -ChildPath $filename

            try {
                if (Test-Path -Path $TargetFile) {
                    Write-Output "Image for $filename already exists in '$DestinationDir'."
                } elseif ($PSCmdlet.ShouldProcess($Name, "Download Symbol Image")) {
                    Invoke-WebRequest -Uri $ImageUrl -Method Get -OutFile $TargetFile -ErrorAction Stop
                    Write-Output "Downloaded image for $Name to '$TargetFile'."
                }
            } catch {
                Write-Error "Error saving symbol image for $Name : $_"
            }
        } else {
            Write-Host "Symbol $Name not found."
        }
    }
}

function Save-AllSymbols {
    param (
        $symbols, 
        [string]$DestinationDir
    )
    foreach ($symbol in $symbols.data) {
        $name = $symbol.symbol
        write-output $name
        Save-SpecificSymbol -Name ($name) -Symbols $symbols -DestinationDir $DestinationDir
    }
}


function Copy-CardImage {
    param (
        [string]$sourceImagePath,
        [string]$destinationDir
    )

    if (-not (Test-Path -Path $destinationDir)) {
        New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    }

    $filename = Split-Path -Leaf $sourceImagePath
    $destinationImagePath = Join-Path -Path $destinationDir -ChildPath $filename

    Copy-Item -Path $sourceImagePath -Destination $destinationImagePath -Force
    return $destinationImagePath
}
function Save-CardImage {
    [cmdletbinding()]
    param (
        [pscustomobject]$CardDetails,
        [string]$DestinationDir,
        [switch]$WhatIf
    )
    $cardName = $CardDetails.CardName

    if ($cardName -match '//') {
        Write-Output "$cardName matches '//'."
        $targetfile = "$($CardDetails.Scryfall_id).jpg"
        Write-Output "Use filename $targetfile"
    } else {
        $targetfile = "$($CardDetails.CardName).jpg"
        Write-Verbose -Message "The string does not contain '//'. Using `"$targetfile`""
    }

    try {
        $imageName = Join-Path -Path $DestinationDir -ChildPath $targetfile
        if (Test-Path $imageName) {
            Write-Output "Image for $($CardDetails.CardName) already exists in $DestinationDir"
        }
        elseif ($WhatIf) {
            Write-Output "WhatIf: Image for $($CardDetails.CardName) would be saved to $imageName"
        }
        else {
            $response = Invoke-WebRequest -Uri $CardDetails.CardImageUrl -OutFile $imageName -ErrorAction Stop
            Write-Output "Downloaded image for $($CardDetails.CardName) to $imageName"
        }
    }
    catch {
        Write-Error "Error saving card image: $_"
         # Don't throw the error, just log it and continue to the next card
    }
}

function Read-DecklistXML {
    param (
        [string]$filePath
    )

    try {
        $fileContent = Get-Content -Path $filePath -Raw
        [xml]$xmlContent = $fileContent

        # Accessing elements in the XML
        $deckName = $xmlContent.Decklist.Deck
        $designGoal = $xmlContent.Decklist.DesignGoal

        $cards = @()

        # Loop through Card elements
        $xmlContent.Decklist.Card | ForEach-Object {
            $card = @{
                Name = $_.Name
                Quantity = $_.Quantity
                Type = $_.Type
                Cost = $_.Cost
                RulesText = $_.RulesText
            }
            $cards += New-Object PSObject -Property $card
        }

        # Outputting the deck information
        $deckInfo = @{
            DeckName = $deckName
            DesignGoal = $designGoal
            Cards = $cards
        }
        return $deckInfo
    }
    catch {
        Write-Error "Error reading XML file: $_"
        throw $_
    }
}
function Save-CardImagesFromXML {
    [cmdletbinding()]
    param (
        [pscustomobject]$deck,
        [string]$destinationDir,
        [switch]$WhatIf
    )

    try {
        # Loop through Card elements
        foreach ($card in $deck.cards) {
            $carddetails = Get-CardDetails -cardName $card.name
            Save-CardImage -CardDetails $carddetails -destinationDir $destinationDir -WhatIf:$WhatIf
        }
    }
    catch {
        Write-Error "Error downloading card images: $_"
        throw $_
    }
}


# Usage example
# Lookup through all xml files in a folder
$decks = Get-Childitem -Path .\xml\*.xml
foreach ($deck in $decks){
    $cards = Read-DecklistXML -filePath $deck.Fullname
    Save-CardImagesFromXML -deck $cards -destinationDir .\assets\magicimages\ -WhatIf
}

# Same images for one deck (.xml)
$cards = Read-DecklistXML -filePath .\xml\affinity.xml
Save-CardImagesFromXML -deck $cards -destinationDir .\assets\magicimages\

# Retrive an image for a single card
$CardInfo = Get-CardDetails -cardName 'Birds of Paradise'
$response = Save-CardImage -CardDetails $CardInfo -destinationDir ".\assets\magicimages\"