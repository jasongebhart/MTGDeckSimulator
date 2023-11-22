function Get-CardDetails {
    param (
        [string]$CardName
    )

    try {
        $response = Get-ScryfallCardDetail -cardName $CardName
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
    }
}

function Get-ScryfallCardDetail {
    param (
        [string]$CardName
    )

    $apiUrl = "https://api.scryfall.com/cards/named?fuzzy=$($CardName -replace ' ', '%20')"
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get
    return $response
}

function DownloadSymbol($name) {
    $symbol = $symbolsResponse.data | Where-Object { $_.symbol -eq $symbolName }

    if ($symbol) {
        $imageUrl = $symbol.svg_uri
        Invoke-RestMethod -Uri $imageUrl -Method Get -OutFile "$symbolName.svg"
        Write-Verbose -Message "Downloaded symbol image: $symbolName"
    } else {
        Write-Verbose -Message "Symbol '$symbolName' not found."
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
        Write-Verbose -Message "Error fetching symbols: $_"
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
                    Write-Verbose -Message "Image for $filename already exists in '$DestinationDir'."
                } elseif ($PSCmdlet.ShouldProcess($Name, "Download Symbol Image")) {
                    Invoke-WebRequest -Uri $ImageUrl -Method Get -OutFile $TargetFile -ErrorAction Stop
                    Write-Verbose -Message "Downloaded image for $Name to '$TargetFile'."
                }
            } catch {
                Write-Error "Error saving symbol image for $Name : $_"
            }
        } else {
            Write-Verbose -Message "Symbol $Name not found."
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
    $CardName = $CardDetails.CardName

    if ($CardName -match '//') {
        Write-Verbose -Message  "$CardName matches '//'."
        $targetfile = "$($CardDetails.Scryfall_id).jpg"
        Write-Verbose -Message  "Use filename $targetfile"
    } else {
        $targetfile = "$($CardDetails.CardName).jpg"
        Write-Verbose -Message "The string does not contain '//'. Using `"$targetfile`""
    }

    try {
        $imageName = Join-Path -Path $DestinationDir -ChildPath $targetfile
        if (Test-Path $imageName) {
            Write-Verbose -Message  "Image for $($CardDetails.CardName) already exists in $DestinationDir"
        }
        elseif ($WhatIf) {
            Write-Verbose -Message  "WhatIf: Image for $($CardDetails.CardName) would be saved to $imageName"
        }
        else {
            $response = Invoke-WebRequest -Uri $CardDetails.CardImageUrl -OutFile $imageName -ErrorAction Stop
            Write-Verbose -Message  "Downloaded image for $($CardDetails.CardName) to $imageName"
        }
    }
    catch {
        Write-Error "Error saving card image: $_"
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
    }
}

# Function to get card details and update XML
function Update-DeckXML {
    param (
        [parameter(Mandatory = $true)]
        [ValidateScript({
            Test-Path $_ -PathType Leaf
        })]
        [string]$deckFilePath,
        [parameter(Mandatory = $true)]
        [ValidateScript({
            Test-Path $_ -PathType Container
        })]
        [string]$destinationDir,
        [parameter(Mandatory = $false)]
        [ValidateScript({
            Test-Path $_ -PathType Container
        })]
        [string]$imageDir = ".\assets\magicimages\"
    )

    try {
        # Read deck XML file
        $deckXml = [xml](Get-Content -Path $deckFilePath)

        # Extract deck information
        $deck = $deckXml.Decklist

        # Iterate through each card in the deck
        foreach ($card in $deck.Card) {
            # Get card details
            $cardDetails = Get-CardDetails -cardName $card.Name

            # Update card information
            $card.Type = $cardDetails.CardType
            $card.Cost = $cardDetails.CardCost
            if (-not $card.RulesText) {
                # Add RulesText property
                $rulesTextElement = $deckXml.CreateElement('RulesText')
                $rulesTextElement.InnerText = $cardDetails.RulesText
                $card.AppendChild($rulesTextElement) | Out-Null
                Write-Verbose -Message "Added RulesText: $($cardDetails.RulesText)"
            }
            else {
                # Update RulesText property
                $card.RulesText = $cardDetails.RulesText
                Write-Verbose -Message "Updated RulesText: $($cardDetails.RulesText)"
            }

            <# Add or update RulesText property
            if (-not $card.PSObject.Properties['RulesText']) {
                # Add RulesText property
                $card | Add-Member -NotePropertyName 'RulesText' -NotePropertyValue $cardDetails.RulesText
                Write-Verbose -Message "$($card.RulesText)"
            }
            else {
                # Update RulesText property
                $card.PSObject.Properties['RulesText'].Value = $cardDetails.RulesText
            }
    #>
            # Save card image if needed
            #Save-CardImage -CardDetails $cardDetails -destinationDir $imageDir
        }

        # Save the updated XML
        $deckXml.Save($deckFilePath)

        Write-Output "Deck XML updated successfully."
    }
    catch {
        Write-Error "Error updating deck XML: $_"
    }
}

# Usage example
$deckFilePath = ".\xml\affinity.xml"
$destinationXMLDir = ".\xml\"

Update-DeckXML -deckFilePath $deckFilePath -destinationDir $destinationXMLDir

# Usage example
# Lookup through all xml files in a folder
$decks = Get-Childitem -Path .\xml\*.xml
foreach ($deck in $decks){
    $cards = Read-DecklistXML -filePath $deck.Fullname
    Save-CardImagesFromXML -deck $cards -destinationDir .\assets\magicimages\ -WhatIf
}

# Lookup through all xml files in a folder and update the xml content
$ExcludedFiles = "_template.xml", "mulligan.xml"
$decks = Get-Childitem -Path .\xml\*.xml -Exclude $ExcludedFiles
foreach ($deck in $decks){
    Write-Output "Update-DeckXML -deckFilePath $($deck.Fullname) -destinationDir $destinationXMLDir -verbose"
    Update-DeckXML -deckFilePath $deck.Fullname -destinationDir $destinationXMLDir -verbose
}

# Same images for one deck (.xml)
$cards = Read-DecklistXML -filePath .\xml\affinity.xml
Save-CardImagesFromXML -deck $cards -destinationDir .\assets\magicimages\

# Retrive an image for a single card
$CardInfo = Get-CardDetails -cardName 'Birds of Paradise'
$response = Save-CardImage -CardDetails $CardInfo -destinationDir ".\assets\magicimages\"